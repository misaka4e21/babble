import { h } from 'virtual-dom'
import Babble from '../../lib/babble'
import RawHtml from 'discourse/widgets/raw-html';
import { dateNode } from 'discourse/helpers/node';
import { avatarImg } from 'discourse/widgets/post'
import { emojiUnescape } from 'discourse/lib/text'
import { transformBasicPost } from 'discourse/lib/transform-post'
import { getPostContent } from '../babble-post'

export default Ember.Object.create({
  render(widget) {
    this.widget     = widget
    this.post       = widget.state.post
    this.topic      = widget.state.topic
    this.isFollowOn = widget.state.isFollowOn
    this.isNewDay   = widget.state.isNewDay
    return this.container()
  },

  container() {
    let css = 'div.babble-post-container'
    if (this.isFollowOn && !this.post.reply_to_post_number) { css += '.babble-follow-on' }
    return h(css, [this.daySeparator(), this.contents()])
  },

  daySeparator() {
    if (!this.isNewDay) { return }
    let date = moment(this.post.created_at)
                     .startOf('day')
                     .calendar({ lastWeek: 'dddd' })
                     .replace('at 12:00 AM', '')
                     .replace('00:00', '')
    return h('div.babble-post-new-day', h('div.babble-post-new-day-message', date))
  },

  contents() {
    if (this.post.deleted_at) {
      return h('div.babble-staged-post.babble-deleted-post', [this.avatarWrapper(), I18n.t('babble.post_deleted_by', {username: this.post.deleted_by_username})])
    } else if (this.post.user_deleted) {
      return h('div.babble-staged-post.babble-deleted-post', [this.avatarWrapper(), this.bodyWrapper()] )
    } else if (this.topic.get('editingPostId') === this.post.id ){
      return this.widget.attach('babble-composer', {
        post:      this.post,
        topic:     this.topic,
        isEditing: true,
        raw:       this.post.raw})
    } else if (this.topic.get('loadingEditId') === this.post.id || this.post.id == -1) {
      return h('div.babble-staged-post', [this.avatarWrapper(), this.bodyWrapper(true)])
    } else {
      return [this.avatarWrapper(), this.bodyWrapper(false)]
    }
  },

  avatarWrapper() {
    return h('div.babble-post-avatar', { attributes: { 'data-user-card': this.post.username } }, this.avatar())
  },

  avatar() {
    if (this.isFollowOn && !this.post.reply_to_post_number) {
      return
    } else if (this.post.user_id) {
      return avatarImg('medium', {template: this.post.avatar_template, username: this.post.username})
    } else {
      return h('i.fa.fa-trash-o.deleted-user-avatar')
    }
  },

  postName() {
    return h('div.babble-post-name', this.widget.attach('poster-name', this.post))
  },

  postDate() {
    return h('div.babble-post-date', dateNode(this.post.created_at))
  },

  postEdited() {
    if (!this.post.self_edits > 0) { return }
    return h('div.babble-post-edited', I18n.t('babble.post_edited'))
  },

  postMetaData() {
    if (this.isFollowOn && !this.post.reply_to_post_number) { return }
    return h('div.babble-post-meta-data', [
      this.postName(),
      this.postDate(),
      this.postEdited(),
      this.postReply()
    ])
  },

  postReply() {
    const rpn = this.post.get('reply_to_post_number')
    if (rpn) {
      const pc = getPostContent(this.topic, rpn)
      return h('div.babble-post-reply-to',[
        this.widget.attach('link', {
          className: 'reply-jump-link',
          icon: 'reply',
          action: 'jumpToReply'
        }),
        h('span.babble-reply-quote-username',pc.username),
        h('span.babble-reply-quote-content',pc.content)
      ])
    }
  },

  bodyWrapper(staged) {
    return h('div.babble-post-content', [
      this.postMetaData(),
      this.body(staged)
    ])
  },

  body(staged) {
    if (staged) {
      return [this.cooked(), this.loadingSpinner()]
    } else {
      return [this.cooked(), this.unreadLine()]
    }
  },

  cooked() {
    return new RawHtml({ html: `<div class="babble-post-cooked">${emojiUnescape(this.post.cooked)}</div>` })
  },

  unreadLine() {
    if (this.post.post_number != this.topic.lastReadMarker) { return }
    return h('div.babble-last-read-wrapper', [
      h('div.babble-last-read-post-message', I18n.t('babble.new_messages')),
      h('hr.babble-last-read-post-line')
    ])
  },

  loadingSpinner() {
    return h('div.spinner-container', h('div.spinner'))
  }
})
