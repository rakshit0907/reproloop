import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { TransitionDto } from './dto/transition.dto.js';
import { IncidentWorkflowService } from './incident-workflow.service.js';
import { IncidentsService } from './incidents.service.js';

@UseGuards(JwtAuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidents: IncidentsService,
    private readonly workflow: IncidentWorkflowService,
  ) {}

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

  @Get(':id/events')
  events(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflow.listEvents(req.user, id);
  }

  @Post(':id/transitions')
  @HttpCode(200)
  transition(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.workflow.manualTransition(req.user, id, dto);
  }
}
