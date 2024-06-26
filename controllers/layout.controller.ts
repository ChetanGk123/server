import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import LayoutModel from "../models/layout.model";
import cloudinary from "cloudinary";

// create layout
export const createLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const ExistingType = await LayoutModel.findOne({ type });
      if (ExistingType) return next(new ErrorHandler(`${type} already exists`, 400));
      if (type == "Banner") {
        const { image, title, subTitle } = req.body;

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        const banner = {
          image: { public_id: myCloud.public_id, url: myCloud.secure_url },
          title,
          subTitle,
        };

        await LayoutModel.create(banner);
      }

      if (type == "FAQ") {
        const { faq } = req.body;
        /* const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        ); */
        const faqItems = faq;
        await LayoutModel.create({ type: "FAQ", faq: faqItems });
      }

      if (type == "Categories") {
        const { categories } = req.body;
        /* const categoryItems = await Promise.all(
            categories.map(async (item: any) => {
              return {
                title: item.title,
              };
            })
          ); */
        const categoryItems = categories;
        await LayoutModel.create({ type: "Categories", categories: categoryItems });
      }

      res.status(201).json({
        success: true,
        message: `Layout created successfully`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//edit layout
export const editLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (type == "Banner") {
        const bannerData: any = await LayoutModel.findOne({ type: "Banner" });

        const { image, title, subTitle } = req.body;

        if (bannerData) await cloudinary.v2.uploader.destroy(bannerData.image.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        const banner = {
          image: { public_id: myCloud.public_id, url: myCloud.secure_url },
          title,
          subTitle,
        };

        await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
      }

      if (type == "FAQ") {
        const { faq } = req.body;
        const faqItem = await LayoutModel.findOne({ type: "FAQ" });
        /* const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                  return {
                    question: item.question,
                    answer: item.answer,
                  };
                })
              ); */
        const faqItems = faq;
        await LayoutModel.findByIdAndUpdate(faqItem?._id, { type: "FAQ", faq: faqItems });
      }

      if (type == "Categories") {
        const { categories } = req.body;
        const categoryData = await LayoutModel.findOne({ type: "Categories" });
        /* const categoryItems = await Promise.all(
                  categories.map(async (item: any) => {
                    return {
                      title: item.title,
                    };
                  })
                ); */
        const categoryItems = categories;
        await LayoutModel.findByIdAndUpdate(categoryData?._id, {
          type: "Categories",
          categories: categoryItems,
        });
      }

      res.status(201).json({
        success: true,
        message: `Layout updated successfully`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get layout by type
export const getLayoutByType = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const layout = await LayoutModel.findOne({ type: req.body.type });
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
