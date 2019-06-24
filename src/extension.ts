import { addCommand, notify } from './utils';
import { workspace, ExtensionContext, ConfigurationTarget } from 'vscode';
import { isEmpty, merge } from 'lodash';

const MY_CONFIGURATION_NAME = 'hide-files';
const MY_PROPERTY_NAME = 'exclude';
const FILES_CONFIGURATION_NAME = 'files';
const EXCLUDE_PROPERTY_NAME = 'exclude';

function getConfiguration(key: string) {
    return workspace.getConfiguration(key, null);
}

function getConfigurationValue(
    configurationName: string,
    propertyName: string
) {
    return getConfiguration(configurationName).get(propertyName);
}

function filesAreCurrentlyHidden() {
    //i'm determining that the files are hidden if my configuration object is empty; now, this
    //could be fooled if the user manually adds something to my config object
    //on their own, but they shouldn't do that
    const files = getConfigurationValue(
        MY_CONFIGURATION_NAME,
        MY_PROPERTY_NAME
    );
    return isEmpty(files);
}

async function setConfigurationProperty(
    configuration: string,
    property: string,
    value: any
) {
    await getConfiguration(configuration).update(
        property,
        value,
        ConfigurationTarget.Global
    );
}

async function removeConfigurationProperty(
    configuration: string,
    property: string
) {
    //setting the "value" to "undefined" removes the key from the configuration (per vscode docs)
    await getConfiguration(configuration).update(
        property,
        undefined,
        ConfigurationTarget.Global
    );
}

async function moveProperties(
    fromConfigurationKey: string,
    fromPropertyKey: string,
    toConfigurationKey: string,
    toPropertyKey: string
) {
    const fromObj =
        getConfigurationValue(fromConfigurationKey, fromPropertyKey) || {};
    const toObj =
        getConfigurationValue(toConfigurationKey, toPropertyKey) || {};

    //copy preperties from fromObj -> toObj.
    //"merge" overwrites the values in toObj (if there are any with the same key
    //in fromObj), which I think is okay; in the normal case (and every case I believe), one
    //obj should be empty and the other full, so this shouldn't matter; in any case, if it
    //does matter, then consider using "defaults" instead
    const newToObj = merge(toObj, fromObj);

    //update the configurations
    try {
        await removeConfigurationProperty(
            fromConfigurationKey,
            fromPropertyKey
        );
        await setConfigurationProperty(
            toConfigurationKey,
            toPropertyKey,
            newToObj
        );
    } catch (e) {
        console.error(e);
    }
}

async function toggleFileVisibility() {
    // if files are hidden,
    if (filesAreCurrentlyHidden()) {
        notify('Showing files');
        //move entries from "files.exclude" -> "hide-files.exclude"
        moveProperties(
            FILES_CONFIGURATION_NAME,
            EXCLUDE_PROPERTY_NAME,
            MY_CONFIGURATION_NAME,
            MY_PROPERTY_NAME
        );
    } else {
        //move entries from "hide-files.exclude" -> "files.exclude"
        notify('Hiding files');
        moveProperties(
            MY_CONFIGURATION_NAME,
            MY_PROPERTY_NAME,
            FILES_CONFIGURATION_NAME,
            EXCLUDE_PROPERTY_NAME
        );
    }
}

export function activate(context: ExtensionContext) {
    addCommand('hide-files.toggle', toggleFileVisibility, context);
}

export function deactivate() {}
