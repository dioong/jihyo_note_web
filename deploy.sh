yarn install
yarn run build
aws s3 sync ./build s3://www.bepro11.com --delete
aws cloudfront create-invalidation --distribution-id E2IZE91IQ5P2GA --paths "/*"
echo $(tput setaf 3)production update completed! $(tput setaf 2)www.bepro11.com$(tput sgr0)