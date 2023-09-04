import * as kafkaTopic from './topics.kafka';

export const KEY = {
  EWALLET: {
    ZALOPAY: kafkaTopic.TXN.ZP_CREATE_ORD,
    VNPAY: kafkaTopic.TXN.VNP_CREATE_ORD,
  },
};
