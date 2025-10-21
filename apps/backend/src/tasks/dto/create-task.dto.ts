import { IsString, IsUrl, IsJSON, IsNumber, IsEnum, Matches, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  task_name: string;

  @IsString()
  @Matches(
    /(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/,
    {message: "task_schedule must use cron expression"}
  )
  task_schedule: string;

  @IsUrl({require_tld: false})
  webhook_url: string;

  @IsJSON()
  json_payload: any;

  @IsNumber()
  max_retry: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  task_status: TaskStatus;
}
