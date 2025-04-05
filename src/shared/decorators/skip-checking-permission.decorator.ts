import { SetMetadata } from '@nestjs/common';

export const SKIP_CHECKING_PERMISSION = 'isPublicPermission';
export const SkipCheckingPermission = () =>
  SetMetadata(SKIP_CHECKING_PERMISSION, true);
