import './style.css'
import { convertXML } from "simple-xml-to-json"

const inputElement = document.querySelector('#files')
const output = document.querySelector('#output')

inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {

  const fileList = this.files;
  const reader = new FileReader();
  
  reader.onload = function(e) {

    const data = convertXML(e.target.result);
    const { ENTRIES: entries, children } = data.NML.children[2].COLLECTION
    const html = []

    children.forEach(entry => {
      const {ARTIST: artist, TITLE: title} = entry.ENTRY
      html.push(`<tr><td>${artist}</td><td>${title}</td></tr>`)
    })

    output.innerHTML = html.join('')

  }

  reader.readAsText(fileList[0]);
}

