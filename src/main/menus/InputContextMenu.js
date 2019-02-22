import {app, Menu, shell} from 'electron'
import * as actions from '../actions'

const INPUT_CONTEXT_MENU_TEMPLATE = [
  {role: 'undo'},
  {role: 'redo'},
  {type: 'separator'},
  {role: 'cut'},
  {role: 'copy'},
  {role: 'paste'},
  {role: 'delete'},
  {role: 'selectall'}
]

export default function InputContextMenu () {
  return Menu.buildFromTemplate( INPUT_CONTEXT_MENU_TEMPLATE )
}
