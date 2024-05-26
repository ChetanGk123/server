require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendEmailService from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";
import cloudinary from "cloudinary";

interface IRegistrationBody {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

interface IActivationToken {
  token: string;
  activationCode: string;
}

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const registrationUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as IRegistrationBody;

      if (name === "" || name === undefined) {
        return next(new ErrorHandler("Name is required", 400));
      }

      if (email === "" || email === undefined) {
        return next(new ErrorHandler("Email is required", 400));
      }

      if (password === "" || password === undefined) {
        return next(new ErrorHandler("Password is required", 400));
      }

      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return next(new ErrorHandler("Email already in use", 400));
      }
      const newUser: IRegistrationBody = {
        name,
        email,
        password,
      };
      console.log("registrationUser", newUser);
      const activationToken = createActivationToken(newUser);
      const activationCode = activationToken.activationCode;

      const data = { user: { name: newUser.name }, activationCode };
      const html = ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);
      try {
        await sendEmailService({
          email: newUser.email,
          subject: "Account Activation",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${newUser.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return new ErrorHandler(error.message, 400);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      activationCode,
      user,
    },
    process.env.ACTIVATION_SECRET!,
    { expiresIn: "5m" } //expire after 5 minutes
  );

  return { token, activationCode };
};

// Activate User

export const activateUserAccount = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET! as string
      ) as { user: IUser; activationCode: string };

      console.log("checking activation Code");
      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code!!!", 400));
      }

      const { name, email, password } = newUser.user;
      const existingUser = await userModel.findOne({ email });
      console.log("checking email exists", newUser.user);
      if (existingUser) {
        return next(new ErrorHandler("Email already exists!!!", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });
      console.log("creating new user", user);
      res.status(201).json({
        success: true,
        message: "User created successfully!!!",
        data: {
          userId: user._id,
          name,
          email,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Login in user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (email === "" || email === undefined) {
        return next(new ErrorHandler("Email is required!!!", 400));
      }

      if (password === "" || password === undefined) {
        return next(new ErrorHandler("Password is required!!!", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid Credentials!!!", 400));
      }
      const isPasswordMatch = await user?.comparePassword(password);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid Password!!!", 400));
      }
      // Remove password from user object before sending
      user.password = undefined;
      /* {
        avatar: {
          public_id: 'avatars/jbuzkixipek6hks4lfox',
          url: 
            'https://res.cloudinary.com/dy0avdrpv/image/upload/v1711366260/avatars/jbuzkixipek6hks4lfox.jpg'
        },
        _id: '65dceefba84a0d034137abeb',
        name: 'Chetan',
        email: 'chetangk1234@gmail.com',
        role: 'admin',
        isVerified: false,
        courses: [
          { _id: '65ec6c4b21bf18a2db2652e9' },
          { _id: '65ecb9fe6ee8ea33834a0a6b' }
        ],
        createdAt: '2024-02-26T20:05:15.188Z',
        updatedAt: '2024-03-25T12:11:34.514Z',
        __v: 6
      } */
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.isVerified,
        image: user.avatar.url,
      };
      sendToken(user, 200, res, userData);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const logoutUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const userId = req.user?._id || "";
      redis.del(userId);

      res.status(200).json({
        success: true,
        message: "Logged Out Successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateAccessToken = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("updateAccessToken method invoked");
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
      const message = "Could not refresh token";

      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(new ErrorHandler(message, 400));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "30m",
        }
      );
      const refreshToken = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "1d",
        }
      );

      req.user = user; // for other routes to use the logged in user

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refresh_token, refreshTokenOptions);
      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get user info
export const getUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}
//Social Auth
export const socialAuth = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ name, email, avatar });
        const userData = {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          emailVerified: newUser.isVerified,
          image: newUser.avatar.url,
        };
        sendToken(newUser, 200, res, userData);
      } else {
        const userData = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.isVerified,
          image: user.avatar.url,
        };
        sendToken(user, 200, res, userData);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Update user info
interface IUpdateUserInfoBody {
  email?: string;
  name?: string;
}
export const updateUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as IUpdateUserInfoBody;

      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (email && user) {
        const isEmailExists = await userModel.findOne({ email });
        if (isEmailExists) {
          return next(new ErrorHandler("Email already exists!!!", 400));
        }
        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Update user Password
interface IUpdateUserPasswordBody {
  oldPassword?: string;
  newPassword?: string;
}
export const updateUserPassword = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdateUserPasswordBody;
      const user = await userModel.findById(req.user?._id!).select("+password");
      console.log(user);
      if (!oldPassword || !newPassword) {
        throw new ErrorHandler("Please enter old and new passwords", 400);
      }
      if (user?.password === undefined) {
        throw new ErrorHandler("Invalid user", 400);
      }
      const isPasswordMatch = await user?.comparePassword(oldPassword!);
      if (!isPasswordMatch) {
        throw new ErrorHandler("Incorrect password", 400);
      }

      user.password = newPassword;

      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Update user ProfilePic
interface IUpdateUserProfilePicBody {
  avatar: string;
}
export const updateUserProfilePic = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("updateUserProfilePic triggered");
    try {
      const { avatar } = req.body;

      const userId = req.user?._id;

      const user = await userModel.findById(userId);

      if (avatar && user) {
        if (user?.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
            height: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));
      console.log("UserProfilePic Done");
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get all users -- only for admin

export const getAllUsers = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//update user role -- only for admin
export const updateUserRole = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body;
      updateUserRoleService(res, id, role);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Delete user -- only for admin
export const deleteUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userModel.findById(id);
      if (!user) {
        return next(new ErrorHandler("User not found", 500));
      }

      await user.deleteOne({ id });
      await redis.del(id);
      res.status(200).json({
        success: true,
        message: "User deleted successfully.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
