export class ResponseModel<T> {
	data?: T | null;
	message?: string;
	success: boolean = true;
}
