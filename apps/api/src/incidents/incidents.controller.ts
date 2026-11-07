import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto.js';
import { IncidentsService } from './incidents.service.js';

@UseGuards(JwtAuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateIncidentDto) {
    return this.incidents.create(req.user, dto);
  }

  @Get()
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListIncidentsQueryDto,
  ) {
    return this.incidents.list(req.user, query);
  }

  @Get(':id')
  get(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incidents.get(req.user, id);
  }
}
