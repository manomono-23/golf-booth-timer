# 使用するベースイメージ
FROM nginx:alpine

# 静的コンテンツの配置
COPY ./static /usr/share/nginx/html

# Nginxのデフォルト設定ファイルを削除
RUN rm /etc/nginx/conf.d/default.conf

# 新しい設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d

# Basic認証のためのパスワードファイルを作成（このファイルはあらかじめ用意しておく必要があります）
COPY .htpasswd /etc/nginx/.htpasswd
