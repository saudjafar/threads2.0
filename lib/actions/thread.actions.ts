"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}
export async function createThread({ text, author, communityId, path }: Params) {
    try {
        connectToDB();

        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        });

        //Update the user model after creating the thread
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        })

        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Error creating thread: ${error.message}`);
    }


}

export async function fetchThreads(pageNumber = 1, pageSize = 20) {
    connectToDB();

    //Calc number of posts to skip (Pagination)
    const skipAmount = (pageNumber - 1) * pageSize;

    // Fetch threads that have no parents i.e top-level threads
    const threadsQuery = Thread.find
        ({ parentId: { $in: [null, undefined] } })
        .sort({ createAt: 'desc' })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: 'author', model: User })
        .populate({
            path: 'children',
            populate: {
                path: 'author',
                model: User,
                select: "_id name parentId image"
            }
        })

    const totalThreadsCount = await Thread.countDocuments
        ({ parentId: { $in: [null, undefined] } })

    const threads = await threadsQuery.exec();

    const isNext = totalThreadsCount > skipAmount + threads.length;

    return { threads, isNext };
}

export async function fetchThreadById(id: string) {
    connectToDB();

    try {
        //TODO: Populate community
        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image",
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: "_id id name parentId image"
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: "_id id name parentId image"
                        }
                    }
                ]
            }).exec();

        return thread;
    } catch (error: any) {
        throw new Error(`Error fetching thread: ${error.message}`);
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string,
) {
    connectToDB();

    try {
        //add a comment to the thread
        //Find OG thread by ID

        const originalThread = await Thread.findById(threadId);

        if (!originalThread) {
            throw new Error("Thread not found");
        }

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        });

        //save the new thread

        const savedCommentThread = await commentThread.save();

        //update the og thread to include the new comment
        originalThread.children.push(savedCommentThread._id);

        //save the og thread
        await originalThread.save();

        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Error adding comment to thread: ${error.message}`);
    }
}