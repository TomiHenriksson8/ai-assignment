import {Request, Response, NextFunction} from 'express';
import fetchData from '../../lib/fetchData';
import CustomError from '../../classes/CustomError';

const commentPost = async (
  req: Request<{}, {}, { text: string }>,
  res: Response<{ response: string }>,
  next: NextFunction
) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || text.trim() === "") {
      return res.status(400).json({ response: "Comment text cannot be empty." });
    }

    // Prepare the payload for OpenAI API request
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful and optimistic AI assistant, always offering positive and thoughtful replies to YouTube comments." },        { role: "user", content: text }
      ],
      temperature: 0.7
    };

    // Define request options
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    // Send request using fetchData
    const aiResponse = await fetchData<{ choices: { message: { content: string } }[] }>(
      process.env.OPENAI_API_URL + '/v1/chat/completions',
      options
    );

    // Extract the response content
    const responseText = aiResponse.choices[0].message.content;

    // Send the response as JSON
    return res.status(200).json({ response: responseText });

  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export { commentPost };
