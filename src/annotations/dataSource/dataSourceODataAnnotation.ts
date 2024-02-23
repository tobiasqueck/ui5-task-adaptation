import DataSource from "./dataSource";

export default class DataSourceODataAnnotation extends DataSource {

    private dataSourceJson: any;

    constructor(name: string, uri: string, dataSourceJson: any) {
        super(name, uri);
        this.dataSourceJson = dataSourceJson;
    }

    updateManifest() {
        this.dataSourceJson.uri = this.getFilename();
    }

}
