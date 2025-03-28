import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// custom @Public() decorator
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); // pass metadata (key: value) into method
