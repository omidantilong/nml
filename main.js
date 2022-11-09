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
  } else if (e.target.classList.contains("download-csv")) {
    const id = e.target.dataset.id
    downloadCsv(master[id])
  } else if (e.target.classList.contains("download-txt")) {
    const id = e.target.dataset.id
    downloadTxt(master[id])
  }
})

inputElement.addEventListener("change", (e) => {
  iterateFiles(e.target.files)
})

function downloadCsv({ file, data }) {
  json2csvAsync(data)
    .then((csv) => createDownload(file, csv, "text/csv;charset=utf-8", ".csv"))
    .catch((err) => console.log("ERROR: " + err.message))
}

function downloadTxt({ file, data }) {
  const txt = data.map((entry) => `${entry.artist} — ${entry.title}`).join("\n")
  createDownload(file, txt, "text/plain;charset=utf-8", ".txt")
}

function createDownload(file, content, type, extension) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", file.replace(".nml", extension))
  link.click()
  link.remove()
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
            <button class="action download download-csv" data-id="${uuid}">Download CSV</button>
            <button class="action download download-txt" data-id="${uuid}">Download TXT</button>
            <button class="action remove" data-id="${uuid}">Clear</button>
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
