import AppVariantManager from "./appVariantManager";
import BaseAppManager from "./baseAppManager";
import HTML5RepoManager from "./html5RepoManager";
import { ITaskParameters } from "./model/types";
import ResourceUtil from "./util/resourceUtil";

/**
 * Creates an appVariant bundle from the provided resources.
 */
module.exports = ({ workspace, options, taskUtil }: ITaskParameters) => {

    async function process(workspace: any, taskUtil: any) {
        const appVariantResources = await AppVariantManager.getAppVariantResources(workspace);
        const appVariantInfo = await AppVariantManager.process(appVariantResources, options.projectNamespace, taskUtil);
        const baseAppFiles = await getBaseAppFiles(appVariantInfo.reference);
        const baseAppResources = await BaseAppManager.process(baseAppFiles, appVariantInfo, options);
        await Promise.all(appVariantResources.concat(baseAppResources).map(resource => workspace.write(resource)));
    }


    async function getBaseAppFiles(baseAppId: string) {
        let baseAppFiles = await ResourceUtil.readTemp(baseAppId);
        if (baseAppFiles.size === 0) {
            baseAppFiles = await HTML5RepoManager.getBaseAppFiles(options.configuration);
            await ResourceUtil.writeTemp(baseAppId, baseAppFiles);
        }
        return baseAppFiles;
    }


    return process(workspace, taskUtil);

}