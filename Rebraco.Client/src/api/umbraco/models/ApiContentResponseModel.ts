/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiContentRouteModel } from './ApiContentRouteModel';
export type ApiContentResponseModel = {
    id: string;
    contentType: string;
    properties: Record<string, any>;
    name: string;
    createDate: string;
    updateDate: string;
    route: ApiContentRouteModel;
    cultures: Record<string, ApiContentRouteModel>;
};

