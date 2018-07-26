import {app, Menu, shell} from 'electron'
import * as actions from '../actions'

const PROJECT_CONTEXT_MENU_TEMPLATE = [
  {label: 'Open in Illustrator', click() { actions.openInIllustrator() }},
  {label: 'Open folder', click() { actions.openFolder() }},
  {label: 'Open preview in browser', click() { actions.openPreview() }},
  {type: 'separator'},
  {label: 'Copy embed code', click() { actions.copyEmbedCode() }},
  {label: 'Copy preview link', click() { actions.copyPreviewLink() }},
  {type: 'separator'},
  //{label: 'Edit', click() { console.log('edit clicked') }},
  {label: 'Deploy', click() { actions.deployProject() }},
  {type: 'separator'},
  {label: 'Remove from list', click() { actions.removeFromList() }},
  //{label: 'Delete from servers', click() { actions.removeFromServer() }},
  {label: 'Delete permanently', click() { actions.deleteAll() }},
]

export default function ProjectContextMenu () {
  return Menu.buildFromTemplate( PROJECT_CONTEXT_MENU_TEMPLATE )
}
