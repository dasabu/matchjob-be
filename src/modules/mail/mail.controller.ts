import { Controller, Get, Post } from '@nestjs/common';

import { Public } from 'src/shared/decorators/public.decorator';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import {
  Subscriber,
  SubscriberDocument,
} from '../subscribers/schemas/subscriber.entity';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  @Get()
  @Public()
  @Cron(CronExpression.EVERY_WEEKEND)
  async sendMail() {
    // find all subscribers
    const subscribers = await this.subscriberModel.find({});

    for (const subscriber of subscribers) {
      // get subscribed skills
      const subscriberSkills = subscriber.skills;
      // get jobs required these skills
      const jobsWithMatchingSkills = await this.jobModel.find({
        skills: { $in: subscriberSkills },
      });
      if (jobsWithMatchingSkills?.length) {
        const jobs = jobsWithMatchingSkills.map((job) => {
          return {
            name: job.name,
            company: job.company.name,
            salary:
              `${job.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ',
            skills: job.skills,
            level: job.level,
          };
        });
        await this.mailerService.sendMail({
          to: subscriber.email,
          from: '"MatchJob Career": <matchjob.career@gmail.com>',
          subject: 'MatchJob Alert Bot',
          template: 'job',
          context: {
            receiver: subscriber.name,
            jobs: jobs,
          },
        });
      }
    }
  }
}
