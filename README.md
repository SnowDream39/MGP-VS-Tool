# 萌娘百科虚拟歌手条目生成工具

利用 [vocaDB](https://vocadb.org) 的数据。

除此之外还有一些额外功能，比如查看 [billboard](https://www.billboard-japan.com/charts/detail?a=niconico)……


## 关于 STAFF 标注

vocaDB 上的 STAFF 标注有 `categories` 和 `effectiveRoles` 两个字段，这两者要么相同，要么其中一个是 `Default` 或者 `Other`。

如果 `categories` 中包含 `Producer`，那么实际的角色可能会完整标注，也可能省略掉。如果省略了，程序会默认生成“词·曲”，请自行看情况补充。
