import "./style.css"
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
    const parser = new DOMParser()
    const doc = parser.parseFromString(e.target.result, "application/xml")
    const playlist = Array.from(doc.querySelectorAll("PLAYLIST ENTRY"))
    const collection = Array.from(doc.querySelectorAll("COLLECTION ENTRY"))

    const keys = playlist.map((entry) =>
      entry.querySelector("PRIMARYKEY").getAttribute("KEY").split("/:").pop()
    )

    const entries = collection.map((entry) => {
      const artist = entry.getAttribute("ARTIST") || "-"
      const title = entry.getAttribute("TITLE") || "-"
      const album = entry.querySelector("ALBUM")?.getAttribute("TITLE") || "-"
      const tempo = entry.querySelector("TEMPO")?.getAttribute("BPM") || "-"

      const file = entry
        .querySelector("LOCATION")
        .getAttribute("FILE")
        .replace(":", "")

      const order = keys.indexOf(file) + 1

      return { order, artist, title, album, tempo, file }
    })
    console.groupCollapsed(file.name)
    console.log(entries)
    console.groupEnd()

    const html = []
    const data = []
    const uuid = playlist.UUID
    html.push(
      `<details open data-id="${uuid}">
        <summary>
          <h2>${file.name} (${collection.length})</h2>
          <div class="actions">
            <button class="download" data-id="${uuid}">Download CSV</button>
            <button class="remove" data-id="${uuid}">Remove</button>
          </div>
        </summary>
        <table width="100%">
          ${thead}
          <tbody>`
    )

    entries
      .sort((a, b) => a.order - b.order)
      .forEach((entry, i) => {
        data.push(entry)

        html.push(
          `<tr>
          <td>${i + 1}</td>
          <td>${entry.artist}</td>
          <td>${entry.title}</td>
          <td>${entry.album}</td>
          <td>${entry.tempo}</td>
          <td>${entry.file}</td>
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
