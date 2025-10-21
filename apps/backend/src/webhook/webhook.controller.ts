import { Controller, Post, Body, Res, Req } from "@nestjs/common";
import { Request, Response } from "express";

let requestCount = 0;



@Controller("webhook")
export class WebhookController {
  @Post()
  async handleWebhook(
    @Body() body: any,
    @Res() res: Response,
  ) {
    requestCount++;
    console.log(`Webhook received (count: ${requestCount}):`, body);

    const latency = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    await new Promise((resolve) => setTimeout(resolve, latency));

    if (requestCount % 7 === 0 || requestCount % 11 === 0) {
      return res.status(500).json({
        message: "Internal Server Error (simulated)",
        count: requestCount,
      });
    }

    return res.status(200).json({
      message: "Webhook received successfully",
      count: requestCount,
      latency: `${latency}ms`,
    });
  }
}
