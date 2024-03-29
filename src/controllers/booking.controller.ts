import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { handleError } from '../errors/handle.error';
import BookingModel from '../models/booking.model';
import BeautyPackageModel from '../models/beautyPackage.model';
import UserModel from '../models/user.model';
import { bookingType } from '../types/booking.type';

export default class BookingController {
  constructor() {}

  public async createABooking(req: Request, res: Response): Promise<void> {
    try {
      const { bid } = req.params;

      if (!mongoose.Types.ObjectId.isValid(bid)) {
        res.status(404).json({ message: 'Beauty Package Not Found' });
      }

      const user = await UserModel.findById(req.user?._id).populate('bookings');

      const alreadyBooked = user?.bookings.find(
        (booking: bookingType) => bid === booking.beautyPackage._id.toString()
      );

      if (alreadyBooked) {
        res.status(403).json({ message: 'Beauty Package already booked' });
        return;
      }

      await Promise.resolve().then(async () => {
        const booking = await BookingModel.create({
          beautyPackage: bid,
          user: req.user?._id,
        });

        await BeautyPackageModel.findByIdAndUpdate(bid, {
          $addToSet: {
            bookings: booking,
          },
        });

        await UserModel.findByIdAndUpdate(req.user?._id, {
          $addToSet: {
            bookings: booking,
          },
        });

        res.status(200).json(booking);
      });
    } catch (error: unknown) {
      await handleError(error, res);
    }
  }

  public async getSingleBooking(req: Request, res: Response): Promise<void> {
    try {
      const { boid } = req.params;

      if (!mongoose.Types.ObjectId.isValid(boid)) {
        res.status(404).json({ message: 'Booking not found' });
      }

      const booking = await BookingModel.findById(boid);

      res.status(200).json(booking);
    } catch (error: unknown) {
      await handleError(error, res);
    }
  }

  public async deleteABooking(req: Request, res: Response): Promise<void> {
    try {
      const { bid } = req.params;

      if (!mongoose.Types.ObjectId.isValid(bid)) {
        res.status(404).json({ message: 'Booking not found' });
      }

      const existedBooking = await BookingModel.findById(bid);

      if (!existedBooking) {
        res.status(403).json({ message: "Booking doesn't exist" });
        return;
      }

      const user = await UserModel.findById(req.user?._id);

      const matchedBooking = user?.bookings.find(
        (booking: bookingType) => bid === booking._id.toString()
      );

      if (!matchedBooking) {
        res.status(403).json({ message: "Booking doesn't exist" });
        return;
      }

      await Promise.resolve().then(async () => {
        const booking = await BookingModel.findByIdAndDelete(bid);

        res.status(200).json(booking);
      });
    } catch (error: unknown) {
      await handleError(error, res);
    }
  }

  public async getAllBooking(req: Request, res: Response): Promise<void> {
    try {
      await Promise.resolve().then(async () => {
        const bookings = await BookingModel.find({}).populate(
          'beautyPackage user'
        );
        res.status(200).json(bookings);
      });
    } catch (error: unknown) {
      await handleError(error, res);
    }
  }
}
