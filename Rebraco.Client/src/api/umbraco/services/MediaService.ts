/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiMediaWithCropsResponseModel } from '../models/ApiMediaWithCropsResponseModel';
import type { PagedIApiMediaWithCropsResponseModel } from '../models/PagedIApiMediaWithCropsResponseModel';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MediaService {
    /**
     * @param fetch Specifies the media items to fetch. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param filter Defines how to filter the fetched media items. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param sort Defines how to sort the found media items. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param skip Specifies the number of found media items to skip. Use this to control pagination of the response.
     * @param take Specifies the number of found media items to take. Use this to control pagination of the response.
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @returns any OK
     * @throws ApiError
     */
    public static getMedia20(
        fetch?: string,
        filter?: Array<string>,
        sort?: Array<string>,
        skip?: number,
        take: number = 10,
        expand?: string,
        fields?: string,
        apiKey?: string,
    ): CancelablePromise<PagedIApiMediaWithCropsResponseModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/media',
            headers: {
                'Api-Key': apiKey,
            },
            query: {
                'fetch': fetch,
                'filter': filter,
                'sort': sort,
                'skip': skip,
                'take': take,
                'expand': expand,
                'fields': fields,
            },
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param path
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @returns any OK
     * @throws ApiError
     */
    public static getMediaItemByPath20(
        path: string,
        expand?: string,
        fields?: string,
        apiKey?: string,
    ): CancelablePromise<ApiMediaWithCropsResponseModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/media/item/{path}',
            path: {
                'path': path,
            },
            headers: {
                'Api-Key': apiKey,
            },
            query: {
                'expand': expand,
                'fields': fields,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param id
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @returns any OK
     * @throws ApiError
     */
    public static getMediaItemById20(
        id: string,
        expand?: string,
        fields?: string,
        apiKey?: string,
    ): CancelablePromise<ApiMediaWithCropsResponseModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/media/item/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Api-Key': apiKey,
            },
            query: {
                'expand': expand,
                'fields': fields,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param id
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api/media-delivery-api#query-parameters) for more details on this.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @returns any OK
     * @throws ApiError
     */
    public static getMediaItems20(
        id?: Array<string>,
        expand?: string,
        fields?: string,
        apiKey?: string,
    ): CancelablePromise<Array<ApiMediaWithCropsResponseModel>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/media/items',
            headers: {
                'Api-Key': apiKey,
            },
            query: {
                'id': id,
                'expand': expand,
                'fields': fields,
            },
        });
    }
}
