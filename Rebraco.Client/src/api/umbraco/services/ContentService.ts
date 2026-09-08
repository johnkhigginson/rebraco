/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiContentResponseModel } from '../models/ApiContentResponseModel';
import type { PagedIApiContentResponseModel } from '../models/PagedIApiContentResponseModel';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContentService {
    /**
     * @param fetch Specifies the content items to fetch. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param filter Defines how to filter the fetched content items. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param sort Defines how to sort the found content items. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param skip Specifies the number of found content items to skip. Use this to control pagination of the response.
     * @param take Specifies the number of found content items to take. Use this to control pagination of the response.
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param acceptLanguage Defines the language to return. Use this when querying language variant content items.
     * @param acceptSegment Defines the segment to return. Use this when querying segment variant content items.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @param preview Whether to request draft content.
     * @param startItem URL segment or GUID of a root content item.
     * @returns any OK
     * @throws ApiError
     */
    public static getContent20(
        fetch?: string,
        filter?: Array<string>,
        sort?: Array<string>,
        skip?: number,
        take: number = 10,
        expand?: string,
        fields?: string,
        acceptLanguage?: string,
        acceptSegment?: string,
        apiKey?: string,
        preview?: boolean,
        startItem?: string,
    ): CancelablePromise<PagedIApiContentResponseModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/content',
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept-Segment': acceptSegment,
                'Api-Key': apiKey,
                'Preview': preview,
                'Start-Item': startItem,
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
                404: `Not Found`,
            },
        });
    }
    /**
     * @param path
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param acceptLanguage Defines the language to return. Use this when querying language variant content items.
     * @param acceptSegment Defines the segment to return. Use this when querying segment variant content items.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @param preview Whether to request draft content.
     * @param startItem URL segment or GUID of a root content item.
     * @returns any OK
     * @throws ApiError
     */
    public static getContentItemByPath20(
        path: string = '',
        expand?: string,
        fields?: string,
        acceptLanguage?: string,
        acceptSegment?: string,
        apiKey?: string,
        preview?: boolean,
        startItem?: string,
    ): CancelablePromise<ApiContentResponseModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/content/item/{path}',
            path: {
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept-Segment': acceptSegment,
                'Api-Key': apiKey,
                'Preview': preview,
                'Start-Item': startItem,
            },
            query: {
                'expand': expand,
                'fields': fields,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param id
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param acceptLanguage Defines the language to return. Use this when querying language variant content items.
     * @param acceptSegment Defines the segment to return. Use this when querying segment variant content items.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @param preview Whether to request draft content.
     * @param startItem URL segment or GUID of a root content item.
     * @returns any OK
     * @throws ApiError
     */
    public static getContentItemById20(
        id: string,
        expand?: string,
        fields?: string,
        acceptLanguage?: string,
        acceptSegment?: string,
        apiKey?: string,
        preview?: boolean,
        startItem?: string,
    ): CancelablePromise<ApiContentResponseModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/content/item/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept-Segment': acceptSegment,
                'Api-Key': apiKey,
                'Preview': preview,
                'Start-Item': startItem,
            },
            query: {
                'expand': expand,
                'fields': fields,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param id
     * @param expand Defines the properties that should be expanded in the response. Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param fields Explicitly defines which properties should be included in the response (by default all properties are included). Refer to [the documentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api#query-parameters) for more details on this.
     * @param acceptLanguage Defines the language to return. Use this when querying language variant content items.
     * @param acceptSegment Defines the segment to return. Use this when querying segment variant content items.
     * @param apiKey API key specified through configuration to authorize access to the API.
     * @param preview Whether to request draft content.
     * @param startItem URL segment or GUID of a root content item.
     * @returns any OK
     * @throws ApiError
     */
    public static getContentItems20(
        id?: Array<string>,
        expand?: string,
        fields?: string,
        acceptLanguage?: string,
        acceptSegment?: string,
        apiKey?: string,
        preview?: boolean,
        startItem?: string,
    ): CancelablePromise<Array<ApiContentResponseModel>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/umbraco/delivery/api/v2/content/items',
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept-Segment': acceptSegment,
                'Api-Key': apiKey,
                'Preview': preview,
                'Start-Item': startItem,
            },
            query: {
                'id': id,
                'expand': expand,
                'fields': fields,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
}
