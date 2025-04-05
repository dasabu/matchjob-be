import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Permission,
  PermissionDocument,
} from '../permissions/schemas/permission.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ADMIN_ROLE, INIT_PERMISSIONS, USER_ROLE } from './sample';

@Injectable()
export class MongoService implements OnModuleInit {
  private readonly logger = new Logger(MongoService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,

    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  async onModuleInit() {
    const init = this.configService.get<string>('INIT_DB');

    if (Boolean(init)) {
      const countUser = await this.userModel.count({});
      const countPermission = await this.permissionModel.count({});
      const countRole = await this.roleModel.count({});

      // create permissions
      if (countPermission === 0) {
        await this.permissionModel.insertMany(INIT_PERMISSIONS); // bulk create
      }

      // create role
      if (countRole === 0) {
        const permissionIds = await this.permissionModel.find({}).select('_id');
        await this.roleModel.insertMany([
          {
            name: ADMIN_ROLE,
            description: 'System Admin (Full permissions)',
            isActive: true,
            permissions: permissionIds,
          },
          {
            name: USER_ROLE,
            description: 'Normal User',
            isActive: true,
            permissions: [],
          },
        ]);
      }

      if (countUser === 0) {
        const adminRole = await this.roleModel.findOne({ name: ADMIN_ROLE });
        await this.userModel.insertMany([
          {
            name: 'Admin',
            email: 'admin@gmail.com',
            password: this.userService.hashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 18,
            gender: 'MALE',
            address: 'VietNam',
            role: adminRole._id,
          },
        ]);
      }

      if (countUser > 0 && countRole > 0 && countPermission > 0) {
        this.logger.log('Init data successfully');
      }
    }
  }
}
