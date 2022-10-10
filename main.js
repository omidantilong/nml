import "./style.css"
import { convertXML } from "simple-xml-to-json"
import { json2csvAsync } from "json-2-csv"

const inputElement = document.querySelector("#files")
const output = document.querySelector("#output")
const body = document.querySelector("body")
const master = {}
const thead = `<thead><tr>
    <th>#</th>
    <th>Artist</th>
    <th>Track</th>
    <th>Album</th>
    <th>BPM</th>
    <th>File</th>
  </tr></thead>`

body.addEventListener("dragenter", dragenter, false)
body.addEventListener("dragover", dragover, false)
body.addEventListener("drop", drop, false)

body.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove")) {
    const id = e.target.dataset.id
    const details = document.querySelector(`details[data-id="${id}"]`)
    if (details) {
      details.remove()
    }
  } else if (e.target.classList.contains("download")) {
    const id = e.target.dataset.id
    downloadCsv(master[id])
  }
})

inputElement.addEventListener(
  "change",
  function () {
    iterateFiles(this.files)
  },
  false
)

function downloadCsv({ file, data }) {
  json2csvAsync(data)
    .then((csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", file.replace(".nml", ".csv"))
      link.click()
      link.remove()
    })
    .catch((err) => console.log("ERROR: " + err.message))
}

function iterateFiles(files) {
  for (let i = 0; i < files.length; i++) {
    handleFile(files[i])
  }
}

function handleFile(file) {
  const reader = new FileReader()

  reader.onload = function (e) {
    const playlist = convertXML(e.target.result)
    const { ENTRIES: count, children } = playlist.NML.children[2].COLLECTION
    const html = []
    const data = []
    const uuid = crypto.randomUUID()
    html.push(
      `<details data-id="${uuid}">
        <summary>
          <h2>${file.name} (${children.length})</h2>
          <div class="actions">
            <button class="download" data-id="${uuid}">Download CSV</button>
            <button class="remove" data-id="${uuid}">Remove</button>
          </div>
        </summary>
        <table width="100%">
          ${thead}
          <tbody>`
    )

    console.log(playlist)

    children.forEach((entry, i) => {
      const track = entry.ENTRY
      const { ARTIST: artist, TITLE: title } = track

      const meta = {}
      const values = {}

      track.children.forEach((child) => {
        const props = Object.keys(child)
        if (props.includes("TEMPO")) {
          meta.tempo = child.TEMPO
        } else if (props.includes("ALBUM")) {
          meta.album = child.ALBUM
        } else if (props.includes("LOCATION")) {
          meta.location = child.LOCATION
        }
      })

      values.artist = artist && artist !== "undefined" ? artist : "-"
      values.title = title
      values.album = meta?.album?.TITLE || "-"
      values.bpm = meta?.tempo?.BPM || "-"
      values.file = meta?.location?.FILE || "-"

      data.push(values)

      html.push(
        `<tr>
          <td>${i + 1}</td>
          <td>${values.artist}</td>
          <td>${values.title}</td>
          <td>${values.album}</td>
          <td>${values.bpm}</td>
          <td>${values.file}</td>
        </tr>`
      )
    })
    html.push("</tbody></table></details>")
    output.innerHTML += html.join("")
    body.classList.add("loaded")
    master[uuid] = { file: file.name, data }
  }

  reader.readAsText(file)
}

function drop(e) {
  e.stopPropagation()
  e.preventDefault()

  const dt = e.dataTransfer
  const files = dt.files

  inputElement.value = ""
  iterateFiles(files)
}

function dragenter(e) {
  e.stopPropagation()
  e.preventDefault()
}

function dragover(e) {
  e.stopPropagation()
  e.preventDefault()
}
