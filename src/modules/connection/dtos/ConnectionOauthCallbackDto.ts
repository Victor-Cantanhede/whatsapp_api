import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConnectionOauthCallbackDto {
	@ApiProperty({ description: 'O código de autorização retornado pelo Facebook Login' })
	@IsString()
	@IsNotEmpty()
	code!: string;

	@ApiProperty({ description: 'ID da conta de WhatsApp Business (WABA)' })
	@IsString()
	@IsNotEmpty()
	waba_id!: string;

	@ApiPropertyOptional({ description: 'Nome opcional para a conexão', default: 'Nova Conexão Embedded' })
	@IsString()
	@IsOptional()
	connection_name?: string;
}
