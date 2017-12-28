#!/bin/sh
ps ef | grep nodejs | grep cluster | grep -v grep
if [ $? -ne 0 ]
then
	nodejs cluster.js > /dev/null &
fi
