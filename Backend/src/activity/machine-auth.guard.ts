import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ComputersService } from '../computers/computers.service';
import { ComputerEntity } from '../database/entities/computer.entity';

@Injectable()
export class MachineAuthGuard implements CanActivate {
  constructor(private readonly computers: ComputersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{
        headers: { authorization?: string };
        computer?: ComputerEntity;
      }>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Machine token required');
    }
    const token = auth.slice(7).trim();
    const computer = await this.computers.validateMachineToken(token);
    if (!computer) throw new UnauthorizedException('Invalid machine token');
    req.computer = computer;
    return true;
  }
}
