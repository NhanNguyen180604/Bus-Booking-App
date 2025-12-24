import { Inject, Injectable } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
import { UploadApiResponse, v2 } from 'cloudinary';
import { RootConfig } from "src/config/config";

@Injectable()
export class CloudinaryService {
    constructor(
        @Inject(RootConfig)
        config: RootConfig,
    ) {
        v2.config({
            cloud_name: config.cloudinary.name,
            api_key: config.cloudinary.key,
            api_secret: config.cloudinary.secret,
        });
    }

    async uploadOneImage(image: File, folder: string) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const uploadResult: UploadApiResponse | undefined = await new Promise((resolve, reject) => {
            v2.uploader.upload_stream({ folder }, (error, uploadResult) => {
                if (error) {
                    return reject(error);
                }
                return resolve(uploadResult);
            }).end(buffer);
        });
        if (!uploadResult) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Could not upload file",
            });
        }
        return {
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url
        };
    }

    async deleteResources(publicIDs: string[]) {
        await v2.api.delete_resources(publicIDs);
    }
}