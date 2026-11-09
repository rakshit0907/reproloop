import { IncidentEvent } from '../incidents/incident-event.entity.js';
import { Incident } from '../incidents/incident.entity.js';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';

export const entities = [User, Project, Incident, IncidentEvent];
