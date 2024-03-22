import { IConfiguration, IMetadata } from "../model/types";

import { unzipZipEntries } from "../util/zipUtil";

import { createAbapServiceProvider } from '@sap-ux/system-access';
import type { AbapTarget } from '@sap-ux/system-access';
import type { AbapServiceProvider } from '@sap-ux/axios-extension';
import { AuthenticationType } from "@sap-ux/store";

const log = require("@ui5/logger").getLogger("@ui5/task-adaptation::AbapRepoManager");

const REQUEST_OPTIONS_XML = {
    responseType: "text",
    headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml"
    }
};

const REQUEST_OPTIONS_JSON = {
    headers: {
        "Accept": "application/json"
    }
};

/**
 * TEMP: quick and dirty solution to distinguish between destination and url.
 *
 * @param destination value of destination configuration
 * @returns target
 */
function toTarget(destination: string): AbapTarget {
    try {
        new URL(destination)
        return {
            url: destination,
            authenticationType: AuthenticationType.ReentranceTicket            
        }
    } catch (error) {
        return {
            destination
        }
    }
}

export default class AbapRepoManager {

    private configuration: IConfiguration;
    private _provider: AbapServiceProvider | undefined;

    constructor(configuration: IConfiguration) {
        this.configuration = configuration;
    }

    protected async getProvider(): Promise<AbapServiceProvider> {
        if (!this._provider) {
            this._provider = await createAbapServiceProvider(toTarget(this.configuration.destination!), { ignoreCertErrors: true }, true, log);
        }
        return this._provider;
    }

    async getAnnotationMetadata(uri: string): Promise<IMetadata> {
        const provider = await this.getProvider();
        const response = await provider.head(uri);
        return { changedOn: response.data.modified };
    }


    async downloadAnnotationFile(uri: string) {
        const provider = await this.getProvider();
        const response = await provider.get(uri, {
            headers: REQUEST_OPTIONS_XML.headers
        });

        return new Map([["annotation.xml", response.data]]);
    }


    async getMetadata(id: string): Promise<IMetadata> {
        const appIndex = (await this.getProvider()).getAppIndex();
        const response = await appIndex.get('/ui5_app_info_json', {
            params: { id },
            headers: REQUEST_OPTIONS_JSON.headers
        });
        const data = JSON.parse(response.data);
        if (data[id]) {
            return {
                changedOn: data[id].url,
                id
            };
        } else {
            throw new Error(`UI5AppInfoJson request doesn't contain metadata for sap.app/id '${id}'`);
        }
    }


    async downloadBaseAppFiles(): Promise<Map<string, string>> {
        const { destination, appName } = this.configuration;
        const encodedAppName = encodeURIComponent(appName!);
        const ui5Repo = (await this.getProvider()).getUi5AbapRepository();
        const response = await ui5Repo.get(`/Repositories('${encodedAppName}')`, {
            params: { 
                DownloadFiles: 'RUNTIME', 
                CodePage: 'UTF8',
                '$format': 'json'
            },
            headers: REQUEST_OPTIONS_XML.headers
        });
        const data = JSON.parse(response.data);
        if (data.d?.ZipArchive.length > 0) {
            const buffer = Buffer.from(data.d.ZipArchive, "base64");
            return unzipZipEntries(buffer);
        }
        throw new Error(`App '${appName}' from '${destination}' doesn't contain files`);
    }
}
