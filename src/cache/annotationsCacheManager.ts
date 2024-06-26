import CacheManager from "./cacheManager";
import { IConfiguration } from "../model/types";

export default class AnnotationsCacheManager extends CacheManager {

    private tempSubFolder: string;

    constructor(configuration: IConfiguration, tempSubFolder: string) {
        super(configuration);
        this.tempSubFolder = tempSubFolder;
    }


    protected getTempId() {
        const { destination, appName } = this.configuration;
        return super.normalizeId(`ui5-${destination}-${appName}-${this.tempSubFolder}`);
    }


    getMetadataFilename(): string {
        return "annotationsmetadata.json";
    }

}