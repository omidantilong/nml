import "./style.css"
import { convertXML } from "simple-xml-to-json"

const inputElement = document.querySelector("#files")
const output = document.querySelector("#output")
const body = document.querySelector("body")
const filename = document.querySelector("#filename")

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
  }
})

const thead = `<thead><tr>
    <th>#</th>
    <th>Artist</th>
    <th>Track</th>
    <th>Album</th>
    <th>BPM</th>
    <th>File</th>
  </tr></thead>`

inputElement.addEventListener(
  "change",
  function () {
    iterateFiles(this.files)
  },
  false
)

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
    const uuid = crypto.randomUUID()
    html.push(
      `<details data-id="${uuid}">
        <summary>
          <h2>${file.name} (${children.length})</h2>
          <button class="remove" data-id="${uuid}">Remove</button>
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
      console.log(meta)

      values.bpm = meta?.tempo?.BPM || "-"
      values.album = meta?.album?.TITLE || "-"
      values.artist = artist && artist !== "undefined" ? artist : "-"
      values.title = title
      values.file = meta?.location?.FILE || "-"

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
    console.log(html)
    output.innerHTML += html.join("")
    body.classList.add("loaded")
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
