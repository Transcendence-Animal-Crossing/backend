import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerification } from './entities/emailVerification.entity';
import { User } from 'src/user/entities/user.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
  ) {}
  async initEmailVerification(email: string, user: User) {
    await this.emailVerificationRepository.save(
      EmailVerification.create(email, user),
    );
  }
  async createEmailToken(email: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationRepository.findOne({
      where: { email },
    });

    if (
      emailVerification &&
      emailVerification.emailToken &&
      (new Date().getTime() - emailVerification.timestamp.getTime()) / 60000 <
        15
    ) {
      throw new HttpException(
        '유효기간이 끝나지 않은 이메일 토큰이 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      const emailToken = (
        Math.floor(Math.random() * 9000000) + 1000000
      ).toString();

      await this.emailVerificationRepository.update(emailVerification.id, {
        emailToken: emailToken,
        timestamp: new Date(),
      });
      return true;
    }
  }

  async sendEmailVerification(email: string) {
    const model = await this.emailVerificationRepository.findOne({
      where: { email },
    });
    if (model && model.emailToken) {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Email',
        text: '이중 인증 코드입니다\n\n' + model.emailToken,
      };

      const sent = await new Promise<boolean>(async function (resolve, reject) {
        return await transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.log('Message sent: %s', error);
            return reject(false);
          }
          console.log('Message sent: %s', info.messageId);
          resolve(true);
        });
      });
      return sent;
    } else {
      throw new HttpException('이메일 전송 실패', HttpStatus.FORBIDDEN);
    }
  }

  async findEmailVerification(user: User): Promise<EmailVerification> {
    const emailVerification = await this.emailVerificationRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!emailVerification)
      throw new HttpException(
        'emailVerification is not found',
        HttpStatus.NOT_FOUND,
      );
    return emailVerification;
  }

  async verifyEmailToken(
    emailVerification: EmailVerification,
    token: string,
  ): Promise<boolean> {
    if (emailVerification && emailVerification.emailToken === token) {
      return true;
    } else {
      throw new HttpException(
        '인증번호가 일치하지 않습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
