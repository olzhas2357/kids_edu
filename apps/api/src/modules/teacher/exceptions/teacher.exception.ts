import { HttpException, HttpStatus } from '@nestjs/common';

export class TeacherNotFoundException extends HttpException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class TeacherForbiddenException extends HttpException {
  constructor(message = 'You do not have access to this resource') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class TeacherConflictException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
