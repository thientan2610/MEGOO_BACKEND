import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';

export const sendMailWithRetries = async (
  mailService: MailerService,
  opt: ISendMailOptions,
  retries = 10,
): Promise<boolean | unknown> => {
  if (retries <= 0) {
    console.error('sendMail  FAILED');

    return false;
  }
  try {
    console.log(
      `sendMailWithRetries, ${retries} times left, from ${opt.from} to ${opt.to}`,
    );

    return mailService.sendMail(opt);
  } catch (error) {
    retries--;
    return sendMailWithRetries(mailService, opt, retries);
  }
};
