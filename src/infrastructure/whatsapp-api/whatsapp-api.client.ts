import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppApiClient {
	private readonly logger = new Logger(WhatsAppApiClient.name);
	private readonly baseUrl: string;

	constructor(private readonly httpService: HttpService) {
		this.baseUrl = process.env.WHATSAPP_CLOUD_API_URL || 'https://graph.facebook.com/v25.0';
	}

	private handleError(url: string, method: string, error: any): never {
		const responseData = error.response?.data;
		const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

		this.logger.error(`Error ${method} ${url}: ${error.message} - ${JSON.stringify(responseData || {})}`);

		if (responseData) {
			throw new HttpException(responseData, statusCode);
		}

		throw new HttpException('WhatsApp API Error', statusCode);
	}

	/**
	 * Helper to perform HTTP POST requests to WhatsApp Cloud API.
	 * @param phoneId The WhatsApp Phone Number ID (from the database)
	 * @param userToken The User Access Token (from the database)
	 * @param endpoint The specific endpoint (e.g. '/messages')
	 * @param data The payload
	 */
	async post<T>(phoneId: string, userToken: string, endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> {
		const url = `/${phoneId}${endpoint}`;

		try {
			const headers: Record<string, string> = {
				Authorization: `Bearer ${userToken}`,
				...customHeaders,
			};

			if (!customHeaders?.['Content-Type'] && !(data instanceof FormData)) {
				headers['Content-Type'] = 'application/json';
			}

			const response = await lastValueFrom(
				this.httpService.post<T>(`${this.baseUrl}${url}`, data, {
					headers,
				}),
			);
			return response.data;
		} catch (error: any) {
			this.handleError(url, 'POST', error);
		}
	}

	/**
	 * Helper to perform HTTP GET requests to WhatsApp Cloud API.
	 * @param endpoint The specific endpoint (e.g. '/<MEDIA_ID>')
	 * @param userToken The User Access Token (from the database)
	 */
	async get<T>(endpoint: string, userToken: string, customHeaders?: Record<string, string>): Promise<T> {
		try {
			const headers: Record<string, string> = {
				Authorization: `Bearer ${userToken}`,
				...customHeaders,
			};

			const response = await lastValueFrom(
				this.httpService.get<T>(`${this.baseUrl}${endpoint}`, {
					headers,
				}),
			);
			return response.data;
		} catch (error: any) {
			this.handleError(endpoint, 'GET', error);
		}
	}

	/**
	 * Helper to perform HTTP DELETE requests to WhatsApp Cloud API.
	 * @param endpoint The specific endpoint (e.g. '/<WABA_ID>/message_templates')
	 * @param userToken The User Access Token (from the database)
	 */
	async delete<T>(endpoint: string, userToken: string, customHeaders?: Record<string, string>): Promise<T> {
		try {
			const headers: Record<string, string> = {
				Authorization: `Bearer ${userToken}`,
				...customHeaders,
			};

			const response = await lastValueFrom(
				this.httpService.delete<T>(`${this.baseUrl}${endpoint}`, {
					headers,
				}),
			);
			return response.data;
		} catch (error: any) {
			this.handleError(endpoint, 'DELETE', error);
		}
	}
}
