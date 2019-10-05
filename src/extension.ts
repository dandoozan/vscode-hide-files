import { addCommand, notify } from './utils';
import {
  workspace,
  ExtensionContext,
  ConfigurationTarget,
  window,
} from 'vscode';
import { isEqual } from 'lodash';

const FILES_EXCLUDE_SETTING_NAME = 'files.exclude';
const MY_SETTING_NAME = 'hide-files.files';

function getConfiguration() {
  let uri = window.activeTextEditor
    ? window.activeTextEditor.document.uri
    : null;
  return workspace.getConfiguration('', uri);
}

function areFilesHidden() {
  //check if "files.exclude" contains the files in "hide-files.files"
  //if so, the files are hidden

  //todo: handle case when "hide-files.files" is empty; right now, in that
  //case, this function always returns true, which causes the "Showing files"
  //notification to keep showing up, but the user sees nothing happen
  let configuration = getConfiguration();
  let filesExclude = configuration.get(FILES_EXCLUDE_SETTING_NAME);
  return isEqual(filesExclude, {
    ...filesExclude,
    ...configuration.get(MY_SETTING_NAME),
  });
}

async function showFiles() {
  //remove the local "files.exclude"
  await getConfiguration().update(
    FILES_EXCLUDE_SETTING_NAME,
    undefined,
    ConfigurationTarget.Workspace
  );
}

async function hideFiles() {
  //set "files.exclude" to "hide-files.files"
  let configuration = getConfiguration();
  await configuration.update(
    FILES_EXCLUDE_SETTING_NAME,
    configuration.get(MY_SETTING_NAME),
    ConfigurationTarget.Workspace
  );
}

async function toggleFileVisibility() {
  if (areFilesHidden()) {
    await showFiles();
    notify('Showing files');
  } else {
    await hideFiles();
    notify('Hiding files');
  }
}

export function activate(context: ExtensionContext) {
  addCommand('hide-files.toggle', toggleFileVisibility, context);
}

export function deactivate() {}
