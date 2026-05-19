import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const YOUTUBE_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+/i;

@ValidatorConstraint({ name: 'isYoutubeUrl', async: false })
export class IsYoutubeUrlConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return typeof value === 'string' && YOUTUBE_PATTERN.test(value);
  }

  defaultMessage() {
    return 'url must be a valid YouTube link';
  }
}

export function IsYoutubeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsYoutubeUrlConstraint,
    });
  };
}
