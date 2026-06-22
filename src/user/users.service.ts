import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { InteractionLog } from './interaction-log.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InteractionLog)
    private readonly logRepository: Repository<InteractionLog>,
  ) {}

  /**
   * Crear usuario
   */
  async createUser(dto: CreateUserDto) {
    try {
      // Verificar si ya existe por UUID o Email
      const existingUser = await this.userRepository.findOne({
        where: [{ uuid: dto.uuid }, { email: dto.email }],
      });

      if (existingUser) {
        throw new ConflictException('El usuario o email ya existe');
      }

      // Hashear contraseña si se proporciona
      if (dto.password) {
        const salt = await bcrypt.genSalt();
        dto.password = await bcrypt.hash(dto.password, salt);
      }

      const user = this.userRepository.create(dto);
      const savedUser = await this.userRepository.save(user);

      // Crear log de registro
      await this.logRepository.save({
        user: { id: savedUser.id },
        action: 'register',
        metadata: { email: savedUser.email },
      });

      // No devolver el password
      delete savedUser.password;
      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException(`Error creando usuario: ${error.message}`);
    }
  }

  /**
   * Validar credenciales de usuario (Login)
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'uuid', 'email', 'password', 'name', 'plan'],
    });

    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        
        // Log de login
        await this.logRepository.save({
          user: { id: user.id },
          action: 'login',
          metadata: { method: 'password' },
        });

        return result;
      }
    }
    
    throw new UnauthorizedException('Credenciales inválidas');
  }

  /**
   * Obtener usuario por UUID
   */
  async getUserByUuid(uuid: string) {
    const user = await this.userRepository.findOne({
      where: { uuid: uuid },
      relations: ['logs'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['logs'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['logs'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.getUserById(id);

    Object.assign(user, dto);

    const updatedUser = await this.userRepository.save(user);

    // Crear log de actualización
    await this.logRepository.save({
      user: { id },
      action: 'update_profile',
      metadata: { updated_fields: Object.keys(dto) },
    });

    return updatedUser;
  }

  /**
   * Obtener logs del usuario
   */
  async getUserLogs(userId: number) {
    const user = await this.getUserById(userId);

    return await this.logRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(userId: number) {
    const user = await this.getUserById(userId);

    const totalLogs = await this.logRepository.count({
      where: { user: { id: userId } },
    });

    const actionCounts = await this.logRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(log.id)', 'count')
      .where('log.user_id = :userId', { userId })
      .groupBy('log.action')
      .getRawMany();

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
      totalLogs,
      actionCounts,
    };
  }
}

