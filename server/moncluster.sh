#!/bin/sh
#ps ef | grep nodejs | grep cluster | grep -v grep
netstat -tlnp | grep 8080 | grep nodejs
if [ $? -ne 0 ]
then
	killall -9 nodejs
	nodejs /root/server/cluster.js > /var/log/cluster.log &
fi
