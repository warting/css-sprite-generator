#/bin/sh

if [ $# -eq 0 ]
  then
    echo "No arguments supplied, please enter commit message by typing deploy.sh \"message\""
    exit 0
fi

COMMIT_MESSAGE=$1

if [ -d ../css-sprite-generator-release/ ]; then
  rm -Rf ../css-sprite-generator-release/
fi

if [ -d ./release/ ]; then
  rm -Rf ./release/
  grunt build
fi

git clone https://github.com/warting/css-sprite-generator.git ../css-sprite-generator-release
cd ../css-sprite-generator-release/
git checkout gh-pages

for entry in "."/*
do
  rm -Rf $entry
done

cp -Rf ../css-sprite-generator/release/* ./

git add -A

git commit -am "$COMMIT_MESSAGE"

git push

cd ../css-sprite-generator/

rm -Rf ../css-sprite-generator-release