import "./style.css"
import { convertXML } from "simple-xml-to-json"

const inputElement = document.querySelector("#files")
const output = document.querySelector("#output tbody")
const body = document.querySelector("body")
const filename = document.querySelector("#filename")

body.addEventListener("dragenter", dragenter, false)
body.addEventListener("dragover", dragover, false)
body.addEventListener("drop", drop, false)

inputElement.addEventListener(
  "change",
  function () {
    handleFiles(this.files[0])
  },
  false
)

function handleFiles(file) {
  const reader = new FileReader()

  reader.onload = function (e) {
    const playlist = convertXML(e.target.result)
    const { ENTRIES: entries, children } = playlist.NML.children[2].COLLECTION
    const html = []
    console.log(playlist)
    children.forEach((entry) => {
      const track = entry.ENTRY
      const { ARTIST: artist, TITLE: title } = track
      const { TEMPO: tempo } = track.children[3]
      const { ALBUM: album } = track.children[1]

      const bpm = tempo?.BPM || "-"
      const albumTitle = album?.TITLE || "-"
      html.push(
        `<tr><td>${artist}</td><td>${title}</td><td>${albumTitle}</td><td>${bpm}</td></tr>`
      )
    })
    filename.textContent = file.name
    output.innerHTML = html.join("")
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

  handleFiles(files[0])
}

function dragenter(e) {
  e.stopPropagation()
  e.preventDefault()
}

function dragover(e) {
  e.stopPropagation()
  e.preventDefault()
}
