/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageCropModel } from './ImageCropModel';
import type { ImageFocalPointModel } from './ImageFocalPointModel';
export type ApiMediaWithCropsResponseModel = {
    readonly id: string;
    readonly name: string;
    readonly mediaType: string;
    readonly url: string;
    readonly extension?: string | null;
    readonly width?: number | null;
    readonly height?: number | null;
    readonly bytes?: number | null;
    readonly properties: Record<string, any>;
    focalPoint?: ImageFocalPointModel | null;
    crops?: Array<ImageCropModel> | null;
    path: string;
    createDate: string;
    updateDate: string;
};

