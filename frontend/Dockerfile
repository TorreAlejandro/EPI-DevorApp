FROM denoland/deno:alpine

WORKDIR /app

COPY . .

EXPOSE 5173

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]
