import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { SocialAccount } from './entities/social-account.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialAccount)
    private readonly socialRepository: Repository<SocialAccount>,
  ) {}

  // Conectar cuenta social
  async connectSocialAccount(data: any) {
    const social = this.socialRepository.create({
      user_id: data.user_id,
      platform: data.platform,
      account_id: data.account_id,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: data.token_expires_at,
    });

    return await this.socialRepository.save(social);
  }

  // Obtener redes sociales del usuario
  async getUserSocialAccounts(userId: number) {
    return await this.socialRepository.find({
      where: {
        user_id: userId,
      },
    });
  }

  // Obtener una cuenta social
  async getSocialAccount(id: number) {
    const social = await this.socialRepository.findOne({
      where: { id },
    });

    if (!social) {
      throw new NotFoundException(
        'Cuenta social no encontrada',
      );
    }

    return social;
  }

  // Actualizar cuenta social
  async updateSocialAccount(
    id: number,
    data: any,
  ) {
    const social = await this.getSocialAccount(id);

    Object.assign(social, data);

    return await this.socialRepository.save(social);
  }

  // Eliminar o desactivar
  async deleteSocialAccount(id: number) {
    const social = await this.getSocialAccount(id);

    social.is_active = false;

    return await this.socialRepository.save(social);
  }
}