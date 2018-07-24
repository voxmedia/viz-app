import {app, Menu, shell} from 'electron'
import { openInIllustrator, openFolder, copyEmbedCode, copyLink, deployProject, removeFromList, removeFromServer, deleteAll } from '../actions'

const PROJECT_CONTEXT_MENU_TEMPLATE = [
  {label: 'Open in Illustrator', click() { openInIllustrator() }},
  {label: 'Open folder', click() { openFolder() }},
  {label: 'Copy embed code', click() { copyEmbedCode() }},
  {label: 'Copy link', click() { copyLink() }},
  {type: 'separator'},
  //{label: 'Edit', click() { console.log('edit clicked') }},
  {label: 'Deploy', click() { deployProject() }},
  {type: 'separator'},
  {label: 'Remove from list', click() { removeFromList() }},
  //{label: 'Delete from servers', click() { removeFromServer() }},
  {label: 'Delete permanently', click() { deleteAll() }},
]

export default function ProjectContextMenu () {
  return Menu.buildFromTemplate( PROJECT_CONTEXT_MENU_TEMPLATE )
}
